package public

import (
	"fmt"
	"mime"
	"net/url"
	"strconv"

	"github.com/goccy/go-json"

	"github.com/Allypost/thread-puller/app/config"
	"github.com/Allypost/thread-puller/app/src/fourChan/types/remote"
)

type fileDimension struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type fileVariation struct {
	Dimensions fileDimension `json:"dimensions"`
	Src        fileMetaSrc   `json:"src"`
}

type fileVariations struct {
	Full  fileVariation  `json:"full"`
	Thumb *fileVariation `json:"thumb"`
}

type fileBase struct {
	Id         string         `json:"id"`
	PostId     PostId         `json:"postId"`
	Name       string         `json:"name"`
	Board      string         `json:"board"`
	Filename   string         `json:"filename"`
	Extension  string         `json:"extension"`
	MimeType   string         `json:"mimeType"`
	Variations fileVariations `json:"variations"`
	Size       int            `json:"size"`
	Md5        string         `json:"md5"`
}

type fileMetaMeta struct {
	Type    string `json:"type"`
	IsImage bool   `json:"isImage"`
	IsVideo bool   `json:"isVideo"`
}

type fileMetaSrc struct {
	Local  string `json:"local"`
	Remote string `json:"remote"`
}

type fileMeta struct {
	Meta fileMetaMeta `json:"meta"`
}

type File struct {
	fileBase
	fileMeta
}

func (f File) MarshalBinary() (data []byte, err error) {
	return json.Marshal(f)
}

func (f *File) UnmarshalBinary(data []byte) error {
	return json.Unmarshal(data, &f)
}

func (f File) FromRemote(board string, r *remote.Post) []*File {
	if r.Md5 == "" {
		return []*File{}
	}

	file := File{
		fileBase: fileBase{
			Id:        strconv.Itoa(r.Tim),
			PostId:    PostId(strconv.Itoa(r.No)),
			Name:      r.Filename,
			Board:     board,
			Filename:  strconv.Itoa(r.Tim) + r.Ext,
			Extension: r.Ext[1:], // Remove the dot
			MimeType:  mime.TypeByExtension(r.Ext),
			Variations: fileVariations{
				Full: fileVariation{
					Dimensions: fileDimension{
						Width:  r.W,
						Height: r.H,
					},
				},
				Thumb: &fileVariation{
					Dimensions: fileDimension{
						Width:  r.TnW,
						Height: r.TnH,
					},
				},
			},
			Size: r.FSize,
			Md5:  r.Md5,
		},
	}

	return []*File{
		(&file).withMeta(),
	}
}

func (f *File) withMeta() *File {
	f.Meta = fileMetaMeta{
		Type:    f.FileType(),
		IsImage: f.IsImage(),
		IsVideo: f.IsVideo(),
	}

	f.Variations.Thumb.Src = fileMetaSrc{
		Local:  f.thumbSrc(false),
		Remote: f.thumbSrc(true),
	}
	f.Variations.Full.Src = fileMetaSrc{
		Local:  f.fullSrc(false),
		Remote: f.fullSrc(true),
	}

	return f
}

func (f *File) IsVideo() bool {
	return "video" == f.FileType()
}

func (f *File) IsImage() bool {
	return "image" == f.FileType()
}

func (f *File) fullSrc(original bool) string {
	if original {
		return fmt.Sprintf("https://i.4cdn.org/%s/%s", f.Board, f.Filename)
	}

	return f.cacheUrl()
}

func (f *File) thumbSrc(original bool) string {
	if original {
		return fmt.Sprintf("https://i.4cdn.org/%s/%ss.jpg", f.Board, f.Id)
	}

	return f.thumbUrl()
}

func (f *File) cacheUrl() string {
	u, err := url.Parse(config.CacheUrl())

	if err != nil {
		return ""
	}

	u = u.JoinPath("api", "v3", "4chan", "files", "i", f.Board, f.Filename)

	return u.String()
}

func (f *File) thumbUrl() string {
	u, err := url.Parse(config.CacheUrl())

	if err != nil {
		return ""
	}

	u = u.JoinPath("api", "v3", "4chan", "files", "i", f.Board, fmt.Sprintf("%s%s", f.Id, "s.jpg"))

	return u.String()
}

func (f *File) FileType() string {
	switch f.Extension {
	case "jpg":
		fallthrough
	case "jpeg":
		fallthrough
	case "png":
		fallthrough
	case "gif":
		return "image"

	case "webm":
		fallthrough
	case "mp4":
		return "video"
	}

	return "unknown"
}
