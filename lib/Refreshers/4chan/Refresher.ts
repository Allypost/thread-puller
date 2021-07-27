import consola from 'consola';
import type {
  Opaque,
  ValueOf,
} from 'type-fest';
import Boards from '../../Fetchers/4chan/Boards';
import Threads from '../../Fetchers/4chan/Threads';
import {
  callStorage,
} from '../../Redis/redis';
import type {
  Board,
  Post,
} from '../../Types/4chan/local';

const REDIS_KEY = 'refreshers:4chan:queue' as const;
const REDIS_ENTITY_SEPARATOR = '$' as const;

enum HandlerId {
  Boards = 'Boards',
  Threads = 'Threads',
}

type EntityId = Opaque<string, 'Entity ID'>;

const handlers = {
  [ HandlerId.Boards ]:
    async (): Promise<Board[]> =>
      await Boards.refreshCached(),
  [ HandlerId.Threads ]:
    async (board: EntityId): Promise<Post[]> =>
      await Threads.refreshCached(board),
};

class Entity {
  public readonly handlerId: HandlerId;

  public readonly entityId: EntityId;

  constructor(handlerId: Entity['handlerId'], entityId: string) {
    this.handlerId = handlerId;
    this.entityId = entityId as EntityId;
  }

  public encode(): string {
    return `${ this.handlerId }${ REDIS_ENTITY_SEPARATOR }${ this.entityId }`;
  }

  public static decode(redisEntity: string): Entity {
    const [ handlerId, ...entityIds ] = String(redisEntity).split(REDIS_ENTITY_SEPARATOR);
    const entityId = entityIds.join('$');

    return new this(
      handlerId as Entity['handlerId'],
      entityId as Entity['entityId'],
    );
  }
}

type ProcessResponse = {
  success: boolean;
  entity: Entity;
};

export class EntityStore {
  public static async pop(): Promise<Entity> {
    const redisEntity =
      await callStorage(
        'lpop',
        REDIS_KEY,
      )
    ;

    return Entity.decode(redisEntity);
  }

  public static async push(entity: Entity): Promise<void> {
    const redisEntity = entity.encode();

    await callStorage(
      'rpush',
      REDIS_KEY,
      redisEntity,
    );
  }

  public static async handle(redisEntity: Entity): Promise<ReturnType<ValueOf<typeof handlers>> | null> {
    const {
      handlerId,
      entityId,
    } = redisEntity;
    const handler = handlers[ handlerId ];

    if (!handler) {
      consola.error('Unknown handler', handlerId);
      return null;
    }

    return await handler(entityId);
  }

  public static async populate(): Promise<void> {
    const boards = await handlers[ HandlerId.Boards ]();

    await this.push(new Entity(HandlerId.Boards, 'all'));

    for (const { board } of boards) {
      await this.push(new Entity(HandlerId.Threads, board));
    }
  }

  public static async clean(): Promise<void> {
    await callStorage(
      'del',
      REDIS_KEY,
    );
  }

  public static async processOne(): Promise<ProcessResponse> {
    const entity = await this.pop();
    const res = await this.handle(entity);
    await this.push(entity);

    if (null === res) {
      consola.error('Something went wrong while processing entity', entity);
      return {
        success: false,
        entity,
      };
    }

    return {
      success: true,
      entity,
    };
  }

  public static async processAll(): Promise<ProcessResponse[]> {
    const {
      success,
      entity: firstEntity,
    } = await this.processOne();

    const entities = [
      {
        success,
        entity: firstEntity,
      },
    ];

    let currentEntity = new Entity(HandlerId.Boards, '__TEMP__');
    while (currentEntity.encode() !== firstEntity.encode()) {
      const {
        success,
        entity,
      } = await this.processOne();

      entities.push({
        success,
        entity,
      });

      currentEntity = entity;
    }

    return entities;
  }
}
