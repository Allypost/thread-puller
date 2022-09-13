package minifier

import (
	"net/http"
	"regexp"

	"github.com/tdewolff/minify"
	"github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
	"github.com/tdewolff/minify/json"
	"github.com/tdewolff/minify/svg"
	"github.com/tdewolff/minify/xml"
)

type Minifier struct {
	Minifier *minify.M
}

func New() Minifier {
	m := minify.New()

	m.AddFunc("text/css", css.Minify)
	m.AddFunc("text/html", html.Minify)
	m.AddFunc("image/svg+xml", svg.Minify)
	m.AddFuncRegexp(regexp.MustCompile("^(application|text)/(x-)?(java|ecma)script$"), js.Minify)
	m.AddFuncRegexp(regexp.MustCompile("[/+]json$"), json.Minify)
	m.AddFuncRegexp(regexp.MustCompile("[/+]xml$"), xml.Minify)

	return Minifier{
		Minifier: m,
	}
}

func (m Minifier) Minify(mediaType string, input string) (string, error) {
	return m.Minifier.String(mediaType, input)
}

func (m Minifier) Middleware(next http.Handler) http.Handler {
	return m.Minifier.Middleware(next)
}
