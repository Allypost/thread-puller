import consola from 'consola';
import Boards from '../../Fetchers/4chan/Boards';
import Threads from '../../Fetchers/4chan/Threads';
import {
  callStorage,
} from '../../Redis/redis';

const REDIS_KEY = 'refreshers:4chan:queue';
const REDIS_ENTITY_SEPARATOR = '$';

const handlerIds = {
  boards: 'boards',
  threads: 'threads',
};

const handlers = {
  [ handlerIds.boards ]: boardsRefresher,
  [ handlerIds.threads ]: threadsRefresher,
};

/**
 * @typedef {Object} Entity
 * @property {String} handlerId
 * @property {String} entityId
 */

/**
 * @typedef {Object} ProcessResponse
 * @property {Boolean} success
 * @property {Entity} entity
 */


/**
 * @param {Entity} entity
 * @returns {String}
 */
function encodeEntity(entity) {
  const { handlerId, entityId } = entity;
  return `${ handlerId }${ REDIS_ENTITY_SEPARATOR }${ entityId }`;
}

/**
 * @param {String} redisEntity
 * @returns {Entity}
 */
function decodeRedisEntity(redisEntity) {
  const [ handlerId, ...entityIds ] = String(redisEntity).split(REDIS_ENTITY_SEPARATOR);
  const entityId = entityIds.join('$');

  return { handlerId, entityId };
}

/**
 * @returns {Promise<String>}
 */
async function popRedisEntity() {
  return await callStorage(
    'lpop',
    REDIS_KEY,
  );
}

/**
 * @returns {Promise<Entity>}
 */
async function popEntity() {
  return decodeRedisEntity(await popRedisEntity());
}

/**
 * @param {String} redisEntity
 * @returns {Promise}
 */
async function pushRedisEntity(redisEntity) {
  return await callStorage(
    'rpush',
    REDIS_KEY,
    redisEntity,
  );
}

/**
 * @param {Entity} entity
 * @returns {Promise}
 */
async function pushEntity(entity) {
  return await pushRedisEntity(encodeEntity(entity));
}

/**
 * @param {String} handlerId
 * @param {String} entityId
 * @returns {Promise<unknown>}
 */
async function addEntity(handlerId, entityId) {
  return await pushEntity({ handlerId, entityId });
}

/**
 * @param {Entity} redisEntity
 * @returns {Promise<null|*>}
 */
async function handleEntity(redisEntity) {
  const { handlerId, entityId } = redisEntity;
  const handler = handlers[ handlerId ];

  if (!handler) {
    consola.error('Unknown handler');
    return null;
  }

  return await handler(entityId);
}

async function boardsRefresher() {
  return await Boards.refreshCached();
}

async function threadsRefresher(board) {
  return await Threads.refreshCached(board);
}

export async function populate() {
  const boards = await handlers[ handlerIds.boards ]();

  await addEntity(handlerIds.boards, 'all');

  for (const { board } of boards) {
    await addEntity(handlerIds.threads, board);
  }
}

/**
 * @returns {Promise<void>}
 */
export async function clean() {
  await callStorage(
    'del',
    REDIS_KEY,
  );
}

/**
 * @returns {Promise<ProcessResponse>}
 */
export async function processOne() {
  const entity = await popEntity();
  const res = await handleEntity(entity);
  await pushEntity(entity);

  if (null === res) {
    consola.error('Something went wrong while processing entity', entity);
    return { success: false, entity };
  }

  return { success: true, entity };
}

/**
 * @returns {Promise<ProcessResponse[]>}
 */
export async function processAll() {
  const { success, entity: firstEntity } = await processOne();
  const entities = [ { success, entity: firstEntity } ];

  let currentEntity = {};
  while (encodeEntity(currentEntity) !== encodeEntity(firstEntity)) {
    const { success, entity } = await processOne();

    entities.push({
      success,
      entity,
    });

    currentEntity = entity;
  }

  return entities;
}
