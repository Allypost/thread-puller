package info

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/Allypost/thread-puller/app/providers/requestTimer"
	"github.com/Allypost/thread-puller/app/src/fourChan/fetcher"
	"github.com/Allypost/thread-puller/app/util/api/response"
)

func Boards(ctx *fiber.Ctx) error {
	resp, err := fetcher.BoardFetcher().Fetch()

	if err != nil {
		return response.SendError(ctx, fiber.StatusInternalServerError, "Error fetching boards", err)
	}

	return response.SendSuccess(ctx, resp)
}

func Board(ctx *fiber.Ctx) error {
	boardName := strings.ToLower(strings.TrimSpace(ctx.Params("board")))

	timer := ctx.Locals("timer").(*requestTimer.RequestTimer)
	timer.Start("fetch")
	resp, err := fetcher.BoardFetcher().Fetch()
	timer.End("fetch")

	if err != nil {
		return response.SendError(ctx, fiber.StatusInternalServerError, "Error fetching boards", err)
	}

	for _, board := range resp {
		if board.Board != boardName {
			continue
		}

		return response.SendSuccess(
			ctx,
			board,
		)
	}

	return response.SendError(ctx, fiber.StatusInternalServerError, "Board not found", err)
}
