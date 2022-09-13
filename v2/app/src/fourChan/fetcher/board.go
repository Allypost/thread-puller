package fetcher

import (
	"fmt"
	"strings"

	"github.com/Allypost/thread-puller/app/src/base/fetcher"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/public"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/remote"
	"github.com/Allypost/thread-puller/app/util/logger"
)

func BoardFetcher() fetcher.Fetcher[public.Board, public.Boards] {
	ret := boardFetcher{
		base: fetcher.New[public.Boards, remote.BoardResponse](
			map[string]any{
				"siteName": "fourChan",
				"log":      logger.For("fourChan/fetcher/board"),
			},
		),
	}

	return ret
}

type boardFetcher struct {
	base fetcher.Base[public.Boards, remote.BoardResponse]
}

func (f boardFetcher) Fetch(args ...string) (public.Boards, error) {
	cached, err := f.getCached(args)
	if err != nil {
		return nil, err
	}

	if len(cached) > 0 {
		return cached, nil
	}

	return f.RefreshCached(args...)
}

func (f boardFetcher) FetchOne(args ...string) (*public.Board, error) {
	boards, err := f.Fetch(args[:len(args)-1]...)
	boardName := strings.ToLower(args[0])

	if err != nil {
		return nil, err
	}

	for _, board := range boards {
		if strings.ToLower(board.Board) == boardName {
			return &board, nil
		}
	}

	return nil, fmt.Errorf("board %s not found", boardName)
}

func (f boardFetcher) RefreshCached(args ...string) (public.Boards, error) {
	boards, err := f.fetchLive()
	if err != nil {
		return nil, err
	}

	res, err := f.base.SetCached(boards, args)

	return *res, err
}

func (f boardFetcher) fetchLive() (public.Boards, error) {
	url := "https://a.4cdn.org/boards.json"

	resp := remote.BoardResponse{}
	err := f.base.FetchLiveInto(url, &resp)
	if err != nil {
		return nil, err
	}

	ret := make(public.Boards, len(resp.Boards))

	for i, b := range resp.Boards {
		ret[i] = public.Board{
			Title:       b.Title,
			Board:       b.Board,
			Link:        "/" + b.Board + "/",
			Description: b.MetaDescription,
			Nsfw:        b.Worksafe != 1,
		}
	}

	return ret, nil
}

func (f boardFetcher) getCached(args []string) (public.Boards, error) {
	ret := make(public.Boards, 0)

	return ret, f.base.GetCachedInto(args, &ret)
}
