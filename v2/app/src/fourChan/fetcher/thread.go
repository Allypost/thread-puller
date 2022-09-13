package fetcher

import (
	"fmt"
	"os"
	"strconv"

	"github.com/Allypost/thread-puller/app/src/base/fetcher"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/public"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/remote"
	"github.com/Allypost/thread-puller/app/util/logger"
)

type threadFetcher struct {
	base fetcher.Base[public.Posts, remote.Catalog]
}

func ThreadFetcher() fetcher.Fetcher[public.Post, public.Posts] {
	cacheFor, _ := strconv.Atoi(os.Getenv("THREADPULLER_API_CACHE_FOR"))
	ret := threadFetcher{
		base: fetcher.New[public.Posts, remote.Catalog](
			map[string]any{
				"siteName": "fourChan",
				"log":      logger.For("fourChan/fetcher/thread"),
				"cacheFor": cacheFor,
			},
		),
	}

	return ret
}

func (f threadFetcher) Fetch(args ...string) (public.Posts, error) {
	cached, err := f.getCached(args)
	if err != nil {
		return nil, err
	}

	if len(cached) > 0 {
		return cached, nil
	}

	return f.RefreshCached(args...)
}

func (f threadFetcher) FetchOne(args ...string) (*public.Post, error) {
	posts, err := f.Fetch(args[:len(args)-1]...)
	threadId := public.PostId(args[1])

	if err != nil {
		return nil, err
	}

	for _, post := range posts {
		if post.Thread == threadId {
			return post, nil
		}
	}

	return nil, fmt.Errorf("post %s/%s not found", args[0], threadId)
}

func (f threadFetcher) RefreshCached(args ...string) (public.Posts, error) {
	threads, err := f.fetchLive(args[0])
	if err != nil {
		return nil, err
	}

	res, err := f.base.SetCached(threads, args)

	return *res, err
}

func (f threadFetcher) getCached(args []string) (public.Posts, error) {
	ret := make(public.Posts, 0)

	return ret, f.base.GetCachedInto(args, &ret)
}

func (f threadFetcher) fetchLive(board string) (public.Posts, error) {
	url := fmt.Sprintf("https://a.4cdn.org/%s/catalog.json", board)
	resp := remote.Catalog{}

	err := f.base.FetchLiveInto(url, &resp)
	if err != nil {
		return nil, err
	}

	ret := make(public.Posts, 0)
	for _, t := range resp {
		for _, p := range t.Threads {
			ret = append(
				ret,
				public.Post{}.FromRemote(board, p),
			)
		}
	}

	return ret, nil
}
