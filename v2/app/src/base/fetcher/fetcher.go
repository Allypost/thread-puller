package fetcher

import (
	"encoding"
	"fmt"
	"os"
	"reflect"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/Allypost/thread-puller/app/config"
	"github.com/Allypost/thread-puller/app/providers/redis"
	"github.com/Allypost/thread-puller/app/util/logger"
)

type Keys struct {
	Board  string
	Thread string
	Post   string
}

type Base[Public Encodable, Remote any] struct {
	SiteName        string `default:"base"`
	CacheObjectType string `default:"fetcher"`
	Log             *logger.Logger
	cacheFor        int
}

func get[T any](v map[string]any, key string, fallback T) T {
	if v == nil {
		return fallback
	}

	if val, ok := v[key]; ok {
		return val.(interface{}).(T)
	}

	return fallback
}

func New[Public Encodable, Remote any](
	opts map[string]any,
) Base[Public, Remote] {
	return Base[Public, Remote]{
		CacheObjectType: get(opts, "cacheObjectType", "fetcher"),
		SiteName:        get(opts, "siteName", "base"),
		cacheFor:        get(opts, "cacheFor", 0),
		Log:             get(opts, "log", logger.For("base/fetcher")),
	}
}

func (f Base[Public, Remote]) GetCachedInto(args []string, obj encoding.BinaryUnmarshaler) error {
	cacheKey := f.cacheKey(args)

	resp, err := redis.RedisProvider().Do(
		"get",
		cacheKey,
	).Text()

	if err == redis.Nil {
		f.Log.Debugf("cache miss: %s", cacheKey)
		return nil
	}

	if err != nil {
		return err
	}

	if err := obj.UnmarshalBinary([]byte(resp)); err != nil {
		return err
	}
	f.Log.Debugf("cache hit: %s", cacheKey)

	return nil
}

func (f Base[Public, Remote]) FetchLiveInto(url string, remote *Remote) error {
	statusCode, _, errs :=
		fiber.
			Get(url).
			Referer("https://4chan.org/").
			UserAgent(f.userAgent()).
			Struct(remote)

	if statusCode != 200 {
		return fmt.Errorf("server returned status code %d", statusCode)
	}

	if len(errs) > 0 {
		return errs[0]
	}

	return nil
}

func isNil(i interface{}) bool {
	return i == nil
}

func (f Base[Public, Remote]) SetCached(data Public, args []string) (*Public, error) {
	if isNil(data) {
		return nil, nil
	}

	setArgs := []any{
		f.cacheKey(args),
		data,
	}

	if f.cacheFor > 0 {
		setArgs = append(
			setArgs,
			"EX",
			f.cacheFor,
		)
	}

	cmd := redis.RedisProvider().Do(
		"set",
		setArgs...,
	)

	if err := cmd.Err(); err != nil {
		return nil, err
	}

	return &data, nil
}

func (f Base[Public, Remote]) argsToKeys(args []string) (k Keys) {
	nArgs := len(args)
	i := 0

	if i < nArgs {
		k.Board = args[i]
		i += 1
	}

	if i < nArgs {
		k.Thread = args[i]
		i += 1
	}

	if i < nArgs {
		k.Post = args[i]
		i += 1
	}

	return k
}

func (f Base[Public, Remote]) cacheKey(args []string) string {
	segments := []string{
		f.SiteName,
		f.CacheObjectType,
	}

	keys := f.argsToKeys(args)
	v := reflect.ValueOf(keys)
	vt := v.Type()
	for i := 0; i < v.NumField(); i++ {
		value := v.Field(i).Interface().(string)

		if value == "" {
			continue
		}

		key := vt.Field(i).Name
		segments = append(segments, key, value)
	}

	return strings.Join(segments, ":")
}

func (f Base[Public, Remote]) userAgent() string {
	userAgent, userAgentExists := os.LookupEnv("USER_AGENT")
	if !userAgentExists || userAgent == "" {
		userAgent = fmt.Sprintf(
			"%s crawler (%s)",
			config.AppName(),
			config.AppDomain(),
		)
	}

	return userAgent
}
