package remote

type postBase struct {
	No         int    `json:"no"`
	Now        string `json:"now"`
	Name       string `json:"name"`
	Time       int    `json:"time"`
	Resto      int    `json:"resto"`
	Trip       string `json:"trip,omitempty"`
	Id         string `json:"id,omitempty"`
	Capcode    string `json:"capcode,omitempty"`
	Since4Pass int    `json:"since4pass,omitempty"`
}

type postCountryFlags struct {
	Country     string `json:"country"`
	CountryName string `json:"country_name"`
}

type postBoardFlags struct {
	BoardFlag string `json:"board_flags"`
	FlagName  string `json:"flag_name"`
}

type postAttachment struct {
	Tim           int    `json:"tim"`
	Filename      string `json:"filename"`
	Ext           string `json:"ext"`
	FSize         int    `json:"fsize"`
	Md5           string `json:"md5"`
	W             int    `json:"w"`
	H             int    `json:"h"`
	TnW           int    `json:"tn_w"`
	TnH           int    `json:"tn_h"`
	FileDeleted   int    `json:"filedeleted,omitempty"`
	Spoiler       int    `json:"spoiler,omitempty"`
	CustomSpoiler int    `json:"custom_spoiler,omitempty"`
	MImg          int    `json:"m_img,omitempty"`
}

type postIsOp struct {
	Sticky        int    `json:"sticky,omitempty"`
	Closed        int    `json:"closed,omitempty"`
	Sub           string `json:"sub,omitempty"`
	Com           string `json:"com,omitempty"`
	OmittedPosts  int    `json:"omitted_posts,omitempty"`
	OmittedImages int    `json:"omitted_images,omitempty"`
	Replies       int    `json:"replies"`
	Images        int    `json:"images"`
	BumpLimit     int    `json:"bumplimit,omitempty"`
	ImageLimit    int    `json:"imagelimit,omitempty"`
	LastModified  int    `json:"last_modified"`
	Tag           string `json:"tag"`
	SemanticURL   string `json:"semantic_url"`
}

type postOptional struct {
	postCountryFlags
	postBoardFlags
	postAttachment
}

type Post struct {
	postBase
	postIsOp
	postOptional
}

type PostResponse struct {
	Posts []Post `json:"posts"`
}
