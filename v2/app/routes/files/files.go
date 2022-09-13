package files

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
	fluentFfmpeg "github.com/modfy/fluent-ffmpeg"

	"github.com/Allypost/thread-puller/app/config"
	"github.com/Allypost/thread-puller/app/providers/requestTimer"
)

func Remote(c *fiber.Ctx) error {
	board := c.Params("board")
	resource := c.Params("resource")
	ext := c.Params("ext")

	timer := c.Locals("timer").(*requestTimer.RequestTimer)
	timer.Start("fetch")
	res, err := doRequest(
		fmt.Sprintf("https://i.4cdn.org/%s/%s.%s", board, resource, ext),
		func(header http.Header) {
			header.Set("Range", string(c.Request().Header.Peek("range")))
		},
	)
	timer.End("fetch")

	if err != nil {
		return sendStatus(c, 500)
	}

	mirror := headerMirror(c, res.Header)

	c.Set("Connection", "close")
	mirror("Accept-Ranges")
	mirror("Age")
	mirror("Content-Length")
	mirror("Content-Range")
	mirror("Content-Type")
	mirror("Date")
	mirror("Etag")
	mirror("Expires")
	mirror("Last-Modified")
	mirror("Vary")

	return c.Status(res.StatusCode).SendStream(res.Body)
}

func ThumbJpg(c *fiber.Ctx) error {
	board := c.Params("board")
	resource := c.Params("resource")
	ext := c.Params("ext")

	url := fmt.Sprintf("https://i.4cdn.org/%s/%s.%s", board, resource, ext)

	err := doTranscode(c, "mjpeg", "jpg", url)

	if err != nil {
		return sendStatus(c, 500)
	}

	return nil
}

func ThumbPng(c *fiber.Ctx) error {
	board := c.Params("board")
	resource := c.Params("resource")
	ext := c.Params("ext")

	url := fmt.Sprintf("https://i.4cdn.org/%s/%s.%s", board, resource, ext)

	err := doTranscode(c, "png", "png", url)

	if err != nil {
		return sendStatus(c, 500)
	}

	return nil
}

func userAgent() string {
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

func headerMirror(c *fiber.Ctx, headers http.Header) func(header string) {
	return func(header string) {
		val := headers.Get(header)

		if val == "" {
			return
		}

		c.Set(header, val)
	}
}

func sendStatus(c *fiber.Ctx, status int) error {
	return c.Status(status).Send([]byte{})
}

func doRequest(url string, modifyHeaders ...func(header http.Header)) (*http.Response, error) {
	client := &http.Client{}
	req, err := http.NewRequest(
		"GET",
		url,
		nil,
	)

	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "image/webp,image/apng,image/*,*/*;q=0.8")
	req.Header.Set("Connection", "close")
	req.Header.Set("Accept-Encoding", "gzip, deflate")
	req.Header.Set("Host", "i.4cdn.org")
	req.Header.Set("Cookie", "")
	req.Header.Set("User-Agent", userAgent())
	req.Header.Set("Referer", "https://boards.4chan.org/")

	if len(modifyHeaders) > 0 {
		modifyHeaders[0](req.Header)
	}

	return client.Do(req)
}

func doTranscode(c *fiber.Ctx, codec string, fileType string, url string) error {
	c.Type(fileType)

	timer := c.Locals("timer").(*requestTimer.RequestTimer)
	timer.Start("startCmd")
	cmd := fluentFfmpeg.
		NewCommand("").
		InputPath(url).
		OutputOptions(
			"-f", "image2pipe",
			"-codec:v", codec,
			"-frames:v", "1",
		).
		PipeOutput(c.Response().BodyWriter()).
		Build()
	timer.End("startCmd")

	return cmd.Run()
}
