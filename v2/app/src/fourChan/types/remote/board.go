package remote

type boardCooldowns struct {
	Threads int `json:"threads"`
	Images  int `json:"images"`
	Replies int `json:"replies"`
}

type Board struct {
	Board           string         `json:"board"`
	Title           string         `json:"title"`
	Worksafe        int            `json:"ws_board"`
	PerPage         int            `json:"per_page"`
	Pages           int            `json:"pages"`
	MaxFilesize     int            `json:"max_filesize"`
	MaxWebmFilesize int            `json:"max_webm_filesize"`
	MaxCommentChars int            `json:"max_comment_chars"`
	MaxWebmDuration int            `json:"max_webm_duration"`
	BumpLimit       int            `json:"bump_limit"`
	ImageLimit      int            `json:"image_limit"`
	Cooldowns       boardCooldowns `json:"cooldowns"`
	MetaDescription string         `json:"meta_description"`
	Spoilers        int            `json:"spoilers,omitempty"`
	CustomSpoilers  int            `json:"custom_spoilers,omitempty"`
	IsArchived      int            `json:"is_archived,omitempty"`
	UserIDs         int            `json:"user_ids,omitempty"`
	Oekaki          int            `json:"oekaki,omitempty"`
	SjisTags        int            `json:"sjis_tags,omitempty"`
	MathTags        int            `json:"math_tags,omitempty"`
	TextOnly        int            `json:"text_only,omitempty"`
	ForcedAnon      int            `json:"forced_anon,omitempty"`
	WebmAudio       int            `json:"webm_audio,omitempty"`
	RequireSubject  int            `json:"require_subject,omitempty"`
	MinImageWidth   int            `json:"min_image_width,omitempty"`
	MinImageHeight  int            `json:"min_image_height,omitempty"`
}

type BoardResponse struct {
	Boards []Board `json:"boards"`
}
