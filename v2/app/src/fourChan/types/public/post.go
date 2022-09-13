package public

import (
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/goccy/go-json"

	"github.com/deckarep/golang-set/v2"

	"github.com/Allypost/thread-puller/app/src/fourChan/types/remote"
)

type PostId string

type postBody struct {
	Title   string `json:"title"`
	Poster  string `json:"poster"`
	Content string `json:"content"`
}

type postMetaRefs struct {
	RepliesTo   []PostId `json:"repliesTo"`
	MentionedIn []PostId `json:"mentionedIn"`
}

type postMeta struct {
	Replies  int           `json:"replies"`
	Mentions int           `json:"mentions"`
	Images   int           `json:"images"`
	Videos   int           `json:"videos"`
	Media    int           `json:"media"`
	Refs     *postMetaRefs `json:"refs,omitempty"`
}

type Post struct {
	Id     PostId    `json:"id"`
	Board  string    `json:"board"`
	Thread PostId    `json:"thread"`
	Posted time.Time `json:"posted"`
	Body   postBody  `json:"body"`
	Meta   postMeta  `json:"meta"`
	Files  []*File   `json:"files"`
}

func (p Post) MarshalBinary() (data []byte, err error) {
	return json.Marshal(p)
}

func (p *Post) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, &p)
}

func (p Post) FromRemote(board string, r remote.Post) *Post {
	thread := r.Resto
	if thread == 0 {
		thread = r.No
	}

	return &Post{
		Id:     PostId(strconv.Itoa(r.No)),
		Board:  board,
		Thread: PostId(strconv.Itoa(thread)),
		Posted: time.UnixMilli(int64(r.Time * 1000)),
		Body: postBody{
			Title:   r.Sub,
			Poster:  r.Name,
			Content: strings.ReplaceAll(r.Com, "<wbr>", ""),
		},
		Meta: postMeta{
			Replies: r.Replies,
			Images:  r.Images,
			Videos:  r.Images,
			Media:   r.Images,
			Refs: &postMetaRefs{
				RepliesTo:   []PostId{},
				MentionedIn: []PostId{},
			},
		},
		Files: File{}.FromRemote(board, &r),
	}
}

var postMentionRegex = regexp.MustCompile(`href="#p(\d+)"`)

func (p Post) GetPostIdsMentioned() []PostId {
	content := p.Body.Content

	matchPairs := postMentionRegex.FindAllStringSubmatch(content, -1)
	matches := make([]PostId, len(matchPairs))

	for i, match := range matchPairs {
		matches[i] = PostId(match[1])
	}

	return matches
}

func (p *Post) RecalculateMeta() {
	p.Meta.Images = 0
	p.Meta.Videos = 0
	for _, file := range p.Files {
		fType := file.FileType()

		switch fType {
		case "image":
			p.Meta.Images++
		case "video":
			p.Meta.Videos++
		}
	}

	p.Meta.Media = p.Meta.Images + p.Meta.Videos
}

type Posts []*Post

func (p Posts) MarshalBinary() (data []byte, err error) {
	return json.Marshal(p)
}

func (p *Posts) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, &p)
}

func (p Posts) AddMetas(calculateMetas ...bool) Posts {
	calculateMeta := false
	if len(calculateMetas) > 0 {
		calculateMeta = calculateMetas[0]
	}

	postRepliesTo := make(map[PostId][]PostId)
	postsMentioning := make(map[PostId]mapset.Set[PostId])

	for i, post := range p {
		postId := post.Id

		if calculateMeta {
			post.RecalculateMeta()

			if i != 0 {
				p[0].Meta.Images += post.Meta.Images
				p[0].Meta.Videos += post.Meta.Videos
				p[0].Meta.Media += post.Meta.Media
			}
		}

		mentions := post.GetPostIdsMentioned()

		if len(mentions) == 0 {
			continue
		}

		postRepliesTo[postId] = mentions

		for _, mentionedPostId := range mentions {
			if _, ok := postsMentioning[mentionedPostId]; !ok {
				set := mapset.NewSet[PostId]()
				postsMentioning[mentionedPostId] = set
			}

			postsMentioning[mentionedPostId].Add(postId)
		}
	}

	if !calculateMeta {
		return p
	}

	for _, post := range p {
		if repliesTo, ok := postRepliesTo[post.Id]; ok {
			post.Meta.Refs.RepliesTo = repliesTo
		}

		if mentionedIn, ok := postsMentioning[post.Id]; ok {
			post.Meta.Refs.MentionedIn = mentionedIn.ToSlice()
		}

		post.Meta.Replies = len(post.Meta.Refs.MentionedIn)
		post.Meta.Mentions = len(post.Meta.Refs.RepliesTo)
	}

	return p
}
