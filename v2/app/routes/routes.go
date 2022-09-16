package routes

import (
	"github.com/gofiber/fiber/v2"

	apiFourchanInfo "github.com/Allypost/thread-puller/app/routes/api/fourChan/info"
	"github.com/Allypost/thread-puller/app/routes/base"
	"github.com/Allypost/thread-puller/app/routes/files"
	"github.com/Allypost/thread-puller/app/t"
	"github.com/Allypost/thread-puller/app/util/api/response"
)

func RegisterRoutes(app *fiber.App) {
	Base := app.Group("/")
	Base.Get("/", base.Boards)
	Base.Get("/:board", base.Threads)
	Base.Get("/:board/thread/:thread", base.Thread)
	defer func() {
		Base.Use(
			func(c *fiber.Ctx) (err error) {
				return c.Status(fiber.StatusNotFound).Render(
					"util/404",
					t.Map{},
					"layouts/main",
				)
			},
		)
	}()

	Api := app.Group(
		"/api/v3", func(c *fiber.Ctx) error {
			c.Type("json")

			return c.Next()
		},
	)
	defer func() {
		Api.Use(
			func(c *fiber.Ctx) error {
				return response.SendError(c, fiber.StatusNotFound, "Not Found", nil)
			},
		)
	}()

	Api4chan := Api.Group("/4chan")

	Api4chanBoards := Api4chan.Group("/boards")
	Api4chanBoards.Get("/", apiFourchanInfo.Boards)
	Api4chanBoards.Get("/$:board", apiFourchanInfo.Board)
	Api4chanBoards.Get("/:board", apiFourchanInfo.Threads)
	Api4chanBoards.Get("/:board/:thread", apiFourchanInfo.Posts)

	Api4chanFiles := Api4chan.Group("/files")
	defer func() {
		Api4chanFiles.Use(
			func(c *fiber.Ctx) (err error) {
				return c.Status(fiber.StatusNotFound).Send([]byte{})
			},
		)
	}()
	Api4chanFiles.Get("/i/:board/:resource.:ext", files.Remote)
	Api4chanFiles.Get("/thumb/:board/:resource.:ext.jpg", files.ThumbJpg)
	Api4chanFiles.Get("/thumb/:board/:resource.:ext.png", files.ThumbPng)
}
