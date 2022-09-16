package response

import (
	"github.com/gofiber/fiber/v2"

	"github.com/Allypost/thread-puller/app/t"
)

func response(status string, message *string, data interface{}) t.Map {
	return t.Map{
		"status":  status,
		"message": message,
		"data":    data,
	}
}

func Success[T interface{}](data T) t.Map {
	return response("success", nil, data)
}

func SendSuccess[T interface{}](c *fiber.Ctx, data T) error {
	return c.Status(200).JSON(Success(data))
}

func Error(message string, err error) t.Map {
	var data *string
	if err != nil {
		str := err.Error()
		data = &str
	}

	return response("error", &message, data)
}

func SendError(c *fiber.Ctx, status int, message string, err error) error {
	return c.Status(status).JSON(Error(message, err))
}
