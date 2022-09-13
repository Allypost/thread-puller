package async

import (
	"golang.org/x/sync/errgroup"
)

type asyncUtil struct{}

type asyncUtilParallel struct {
	fns []func() (interface{}, error)
	n   int
}

func Async() asyncUtil {
	return asyncUtil{}
}

func (u asyncUtil) RunInParallel(fn ...func() (interface{}, error)) asyncUtilParallel {
	return asyncUtilParallel{
		fns: fn,
		n:   len(fn),
	}
}

func (p asyncUtilParallel) All() ([]interface{}, error) {
	var g errgroup.Group

	results := make([]interface{}, p.n)
	for i, fn := range p.fns {
		i, fn := i, fn
		g.Go(
			func() error {
				result, err := fn()
				if err == nil {
					results[i] = result
				}
				return err
			},
		)
	}

	if err := g.Wait(); err != nil {
		return nil, err
	}

	return results, nil
}
