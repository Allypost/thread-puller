package info

import (
	"github.com/gofiber/fiber/v2"

	requesttimer "github.com/Allypost/thread-puller/app/providers/requestTimer"
	"github.com/Allypost/thread-puller/app/src/fourChan/fetcher"
	"github.com/Allypost/thread-puller/app/util/api/response"
)

func Posts(ctx *fiber.Ctx) error {
	board := ctx.Params("board")
	thread := ctx.Params("thread")

	timer := ctx.Locals("timer").(*requesttimer.RequestTimer)
	timer.Start("fetch")
	resp, err := fetcher.PostFetcher().Fetch(board, thread)
	timer.End("fetch")

	if err != nil {
		return response.SendError(ctx, fiber.StatusInternalServerError, "Error fetching boards", err)
	}

	return response.SendSuccess(ctx, resp)
}
