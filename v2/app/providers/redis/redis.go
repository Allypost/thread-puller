package redis

import (
	"context"
	"os"

	"github.com/go-redis/redis/v8"

	"github.com/Allypost/thread-puller/app/util/logger"
)

type redisProvider struct {
	client *redis.Client
	logger *logger.Logger
}

const Nil = redis.Nil

var client = redisProvider{
	logger: logger.For("redis"),
}

func RedisProvider() *redisProvider {
	return &client
}

func (r *redisProvider) Init() error {
	if r.client != nil {
		return nil
	}

	r.log("Parsing config...")
	opt, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		return err
	}

	r.client = redis.NewClient(opt)

	r.log("Testing connection...")
	ctx := context.Background()
	status := r.client.Ping(ctx)

	err = status.Err()

	if err == nil {
		r.log("Connected to redis")
	}

	return err
}

func (r *redisProvider) Do(method string, args ...any) *redis.Cmd {
	ctx := context.Background()
	doArgs := append([]any{method}, args...)

	// r.log("> %+v", doArgs)
	res := r.client.Do(ctx, doArgs...)
	// r.log("< %+v", res)

	return res
}

func (r *redisProvider) log(format string, v ...interface{}) {
	r.logger.Printf(format, v...)
}
