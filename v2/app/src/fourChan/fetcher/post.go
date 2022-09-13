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

type postFetcher struct {
	base fetcher.Base[public.Posts, remote.PostResponse]
}

func PostFetcher() fetcher.Fetcher[public.Post, public.Posts] {
	cacheFor, _ := strconv.Atoi(os.Getenv("THREADPULLER_API_CACHE_FOR"))
	ret := postFetcher{
		base: fetcher.New[public.Posts, remote.PostResponse](
			map[string]any{
				"siteName": "fourChan",
				"log":      logger.For("fourChan/fetcher/post"),
				"cacheFor": cacheFor,
			},
		),
	}

	return ret
}

func (f postFetcher) Fetch(args ...string) (public.Posts, error) {
	cached, err := f.getCached(args)
	if err != nil {
		return nil, err
	}

	if len(cached) > 0 {
		return cached, nil
	}

	return f.RefreshCached(args...)
}

func (f postFetcher) FetchOne(args ...string) (*public.Post, error) {
	posts, err := f.Fetch(args[:len(args)-1]...)
	postId := public.PostId(args[2])

	if err != nil {
		return nil, err
	}

	for _, post := range posts {
		if post.Id == postId {
			return post, nil
		}
	}

	return nil, fmt.Errorf("post %s/%s/%s not found", args[0], args[1], postId)
}

func (f postFetcher) RefreshCached(args ...string) (public.Posts, error) {
	posts, err := f.fetchLive(args[0], args[1])
	if err != nil {
		return nil, err
	}

	res, err := f.base.SetCached(posts, args)

	return *res, err
}

func (f postFetcher) getCached(args []string) (public.Posts, error) {
	ret := public.Posts{}

	return ret, f.base.GetCachedInto(args, &ret)
}

func (f postFetcher) fetchLive(board string, thread string) (public.Posts, error) {
	url := fmt.Sprintf("https://a.4cdn.org/%s/thread/%s.json", board, thread)
	resp := remote.PostResponse{}

	err := f.base.FetchLiveInto(url, &resp)
	if err != nil {
		return nil, err
	}

	ret := make(public.Posts, len(resp.Posts))
	for i, p := range resp.Posts {
		ret[i] = public.Post{}.FromRemote(board, p)
	}

	return ret.AddMetas(true), nil
}
