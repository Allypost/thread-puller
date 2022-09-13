package app

import (
	"github.com/joho/godotenv"

	"github.com/Allypost/thread-puller/app/providers/redis"
	"github.com/Allypost/thread-puller/app/util/async"
)

func Init() error {
	if err := godotenv.Load(); err != nil {
		return err
	}

	_, err := async.Async().RunInParallel(
		func() (interface{}, error) {
			return nil, redis.RedisProvider().Init()
		},
	).All()
	if err != nil {
		return err
	}

	return nil
}
