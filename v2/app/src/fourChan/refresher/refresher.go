package refresher

import (
	"fmt"

	redisT "github.com/go-redis/redis/v8"

	"github.com/Allypost/thread-puller/app/providers/redis"
	baseFetcher "github.com/Allypost/thread-puller/app/src/base/fetcher"
	"github.com/Allypost/thread-puller/app/src/fourChan/fetcher"
	"github.com/Allypost/thread-puller/app/src/fourChan/refresher/entity"
	"github.com/Allypost/thread-puller/app/src/fourChan/refresher/handlerId"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/public"
	"github.com/Allypost/thread-puller/app/util/logger"
)

type Handler func(args ...string) (baseFetcher.Encodable, error)

const RedisKey = "refreshers:4chan:queue"

var handlers = make(map[handlerId.HandlerId]Handler)

var log = logger.For("refresher")

func Init() {
	handlers[handlerId.Boards] = func(args ...string) (baseFetcher.Encodable, error) {
		return fetcher.BoardFetcher().RefreshCached()
	}
	handlers[handlerId.Threads] = func(args ...string) (baseFetcher.Encodable, error) {
		return fetcher.ThreadFetcher().RefreshCached(args[0])
	}
}

func Clean() *redisT.Cmd {
	r := redis.RedisProvider()

	log.Debugf("[4chan Refresher] Cleaning queue [%s]", RedisKey)

	return r.Do("del", RedisKey)
}

func Populate() error {
	log.Debugf("[4chan Refresher] Populating queue [%s]", RedisKey)
	boards, err := handlers[handlerId.Boards]()
	if err != nil {
		return fmt.Errorf("failed to get boards: %s", err)
	}

	Push(entity.New(handlerId.Boards, "all"))
	log.Debugf("[4chan Refresher] Added boards overview")

	for _, b := range boards.(public.Boards) {
		Push(entity.New(handlerId.Threads, b.Board))
	}
	log.Debugf("[4chan Refresher] Added all boards overview")

	return nil
}

func ProcessOne() (any, error) {
	ent := Pop()
	if ent == nil {
		return nil, fmt.Errorf("no entity to process")
	}

	res, err := handle(ent)
	if err != nil {
		return nil, err
	}

	Push(*ent)

	return res, nil
}

func Push(entity entity.Entity) *redisT.Cmd {
	r := redis.RedisProvider()

	return r.Do("rpush", RedisKey, entity.String())
}

func Pop() *entity.Entity {
	r := redis.RedisProvider()

	data := r.Do("lpop", RedisKey)

	if data == nil {
		return nil
	}

	resp, err := data.Result()
	if err != nil {
		return nil
	}
	item, err := entity.Decode(resp.(string))
	if err != nil {
		return nil
	}

	return item
}

func handle(entity *entity.Entity) (any, error) {
	handlerId := entity.HandlerId
	entityId := entity.EntityId
	handler := handlers[handlerId]

	if handler == nil {
		return nil, fmt.Errorf("no handler for entity: %s", entity)
	}

	return handler(entityId)
}
