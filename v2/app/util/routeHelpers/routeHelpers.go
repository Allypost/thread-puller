package routeHelpers

func FirstNonEmpty(base string, fallbacks ...string) string {
	if base != "" {
		return base
	}

	for _, fallback := range fallbacks {
		if fallback != "" {
			return fallback
		}
	}

	return ""
}
