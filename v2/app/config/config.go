package config

import (
	"net/url"
	"os"
)

var (
	cacheUrl       = env("THREADPULLER_DOMAIN_CACHE", "http://localhost:8000/")
	apiUrl         = env("THREADPULLER_DOMAIN_API", "http://localhost:8000/api")
	appUrl         = env("THREADPULLER_DOMAIN", "http://localhost:8000")
	appName        = env("THREADPULLER_APP_NAME", "ThreadPuller")
	appTagline     = env("THREADPULLER_APP_TAGLINE", "Pure *Chan media")
	appDescription = env(
		"THREADPULLER_APP_DESCRIPTION",
		"Strips down as much as possible so you can enjoy the pure imagery of the chan denizens.",
	)
	appDomain   = toDomain(appUrl)
	cacheDomain = toDomain(cacheUrl)
)

func CacheUrl() string {
	return cacheUrl
}

func CacheDomain() string {
	return cacheDomain
}

func ApiUrl() string {
	return apiUrl
}

func AppUrl() string {
	return appUrl
}

func AppName() string {
	return appName
}

func AppTagline() string {
	return appTagline
}

func AppDescription() string {
	return appDescription
}

func AppDomain() string {
	return appDomain
}

func env(key, fallback string) string {
	value := os.Getenv(key)

	if len(value) > 0 {
		return value
	}

	return fallback
}

func toDomain(rawUrl string) string {
	u, err := url.Parse(rawUrl)
	if err != nil {
		return ""
	}

	return u.Hostname()
}
