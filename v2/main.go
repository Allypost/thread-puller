package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/etag"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/helmet/v2"

	flag "github.com/spf13/pflag"

	"github.com/goccy/go-json"

	app2 "github.com/Allypost/thread-puller/app"
	"github.com/Allypost/thread-puller/app/config"
	"github.com/Allypost/thread-puller/app/providers/requestTimer"
	"github.com/Allypost/thread-puller/app/providers/viewEngine"
	"github.com/Allypost/thread-puller/app/routes"
	"github.com/Allypost/thread-puller/app/src/fourChan/refresher"
	logger_ "github.com/Allypost/thread-puller/app/util/logger"
)

const defaultPort = 3000
const defaultHost = "0.0.0.0"

//go:embed all:assets/*
var assets embed.FS

//go:embed all:app/views/*
var views embed.FS

var log = logger_.For("main")

type appConfig struct {
	Port int
	Host string
}

func loadConfig() appConfig {
	envPort, err := strconv.ParseInt(os.Getenv("PORT"), 0, 32)
	if err != nil || envPort == 0 {
		envPort = defaultPort
	}

	envHost := os.Getenv("HOST")
	if envHost == "" {
		envHost = defaultHost
	}

	var port int
	var host string

	flag.IntVarP(&port, "port", "p", int(envPort), "Set the port on which the server will run")
	flag.StringVarP(&host, "host", "h", envHost, "Set the host to which the server will bind")
	flag.Parse()

	return appConfig{
		Port: port,
		Host: host,
	}
}

func cspConfig() string {
	cspEntries := map[string][]string{
		"default-src": {
			"'self'",
			config.CacheDomain(),
		},
		"img-src": {
			"'self'",
			"i.4cdn.org",
			config.CacheDomain(),
		},
		"media-src": {
			"'self'",
			"i.4cdn.org",
			config.CacheDomain(),
		},
		"style-src": {
			"'self'",
			"fonts.googleapis.com",
			"'unsafe-inline'",
			config.CacheDomain(),
		},
		"font-src": {
			"fonts.gstatic.com",
		},
		"script-src": {
			"'unsafe-inline'",
		},
	}

	cspItems := make([]string, 0, len(cspEntries))
	for k, v := range cspEntries {
		cspItems = append(
			cspItems,
			fmt.Sprintf(
				"%s %s",
				k,
				strings.Join(v, " "),
			),
		)
	}

	return strings.Join(cspItems, "; ")
}

func main() {
	err := app2.Init()
	if err != nil {
		panic(err)
	}

	conf := loadConfig()

	app := fiber.New(
		fiber.Config{
			DisableKeepalive: true,
			ReadTimeout:      10 * time.Second,
			ServerHeader:     "Microsoft-IIS/7.0",
			AppName:          config.AppName(),
			Views:            viewEngine.InitSubfolder(views, "app/views"),
			JSONEncoder:      json.Marshal,
			JSONDecoder:      json.Unmarshal,
		},
	)

	app.Use(recover.New())
	app.Use(etag.New())
	app.Use(
		logger.New(
			logger.Config{
				Format:     "[${time}] ${method} ${path}\t| ${status} ${latency}\t| ${ua}\t| ${ips} \n",
				TimeZone:   "UTC",
				TimeFormat: "2006/01/02 15:04:05",
			},
		),
	)
	app.Use(
		func(c *fiber.Ctx) error {
			timer := requestTimer.New()
			c.Locals("timer", timer)

			timer.Start("app")
			err := c.Next()
			timer.End("app")

			c.Append("Server-Timing", timer.String())
			return err
		},
	)

	app.Use(
		helmet.New(
			helmet.Config{
				ReferrerPolicy:        "no-referrer-when-downgrade",
				ContentSecurityPolicy: cspConfig(),
			},
		),
	)

	app.Get(
		"/favicon.ico",
		func(c *fiber.Ctx) error {
			c.Type("ico")
			c.Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int((7*24*time.Hour).Seconds())))

			favicon, _ := assets.ReadFile("assets/images/favicon.ico")

			return c.Send(favicon)
		},
	)

	assetsFs, _ := fs.Sub(assets, "assets")
	app.Use(
		"/assets",
		func(ctx *fiber.Ctx) error {
			ctx.Set("Cache-Control", fmt.Sprintf("public, max-age=%d", int((365*24*time.Hour).Seconds())))
			return ctx.Next()
		},
		filesystem.New(
			filesystem.Config{
				Root: http.FS(assetsFs),
			},
		),
	)

	routes.RegisterRoutes(app)

	stopRefresher := make(chan bool)
	defer func() {
		stopRefresher <- true
	}()
	go func() {
		log.Println("Starting refresher...")
		refresher.Init()

		refresher.Clean()

		if err := refresher.Populate(); err != nil {
			panic(err)
		}

		log.Println("Refresher started")
		for {
			select {
			case <-stopRefresher:
				return
			case <-time.After(1 * time.Second):
				if _, err := refresher.ProcessOne(); err != nil {
					log.Println(err)
				}
			}
		}
	}()

	log.Fatal(app.Listen(fmt.Sprintf("%s:%d", conf.Host, conf.Port)))
}
