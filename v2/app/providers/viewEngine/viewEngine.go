package viewEngine

import (
	"io/fs"
	"net/http"
	"time"

	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"

	"github.com/Allypost/thread-puller/app/config"
	"github.com/Allypost/thread-puller/app/providers/viewEngine/handlebars"
	"github.com/Allypost/thread-puller/app/version"
)

func InitSubfolder(subFs fs.FS, subfolder string) fiber.Views {
	newFs, err := fs.Sub(subFs, subfolder)

	if err != nil {
		panic(err)
	}

	return Init(newFs)
}

func Init(fs fs.FS) fiber.Views {
	engine := handlebars.NewFileSystem(
		http.FS(fs),
		".hbs",
	)

	buildTime := version.BuildTime()
	buildTimeFormatted := buildTime.UTC().Format(version.TimeFormat)

	engine.AddFunc(
		"_currentYear",
		func() int {
			return time.Now().Year()
		},
	)

	engine.AddFunc(
		"_buildTime",
		func() string {
			return buildTimeFormatted
		},
	)

	engine.AddFunc(
		"_appName",
		func() string {
			return config.AppName()
		},
	)

	engine.AddFunc(
		"_appTagline",
		func() string {
			return config.AppTagline()
		},
	)

	engine.AddFunc(
		"_appDescription",
		func() string {
			return config.AppDescription()
		},
	)

	engine.AddFunc(
		"toJson",
		func(item interface{}) string {
			data, err := json.Marshal(item)

			if err != nil {
				return ""
			}

			return string(data)
		},
	)

	return engine
}
