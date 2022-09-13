package base

import (
	"github.com/gofiber/fiber/v2"

	"github.com/Allypost/thread-puller/app/providers/requestTimer"
	"github.com/Allypost/thread-puller/app/src/fourChan/fetcher"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/public"
)

func Boards(ctx *fiber.Ctx) error {
	timer := ctx.Locals("timer").(*requestTimer.RequestTimer)
	timer.Start("fetch")
	boards, err := fetcher.BoardFetcher().Fetch()
	timer.End("fetch")

	if err != nil {
		return err
	}

	return ctx.Render(
		"index",
		fiber.Map{
			"boards": boards,
		},
		"layouts/main",
	)
}

func Threads(ctx *fiber.Ctx) error {
	boardId := ctx.Params("board")

	timer := ctx.Locals("timer").(*requestTimer.RequestTimer)

	timer.Start("fetchThr")
	threads, err := fetcher.ThreadFetcher().Fetch(boardId)
	if err != nil {
		return err
	}
	timer.End("fetchThr")

	timer.Start("fetchBrd")
	board, err := fetcher.BoardFetcher().FetchOne(boardId)
	if err != nil {
		return err
	}
	timer.End("fetchBrd")

	timer.Start("render")
	err = ctx.Render(
		"threads",
		fiber.Map{
			"board":   board,
			"threads": threads,
		},
		"layouts/main",
	)
	timer.End("render")

	return err
}

func Thread(ctx *fiber.Ctx) error {
	boardId := ctx.Params("board")
	threadId := ctx.Params("thread")

	timer := ctx.Locals("timer").(*requestTimer.RequestTimer)

	timer.Start("fetchThr")
	posts, err := fetcher.PostFetcher().Fetch(boardId, threadId)
	if err != nil {
		return err
	}
	timer.End("fetchThr")

	timer.Start("fetchBrd")
	board, err := fetcher.BoardFetcher().FetchOne(boardId)
	if err != nil {
		return err
	}
	timer.End("fetchBrd")

	postsWithMedia := make([]*public.Post, 0)
	for _, post := range posts {
		if post.Meta.Media > 0 {
			postsWithMedia = append(postsWithMedia, post)
		}
	}

	timer.Start("render")
	err = ctx.Render(
		"posts",
		fiber.Map{
			"board": board,
			"posts": postsWithMedia,
		},
		"layouts/main",
	)
	timer.End("render")

	return err
}
