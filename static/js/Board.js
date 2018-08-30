const Board = {
    isLongPost(el) {
        return el.scrollHeight > 163;
    },
    getLongPosts() {
        return Array.from(document.querySelectorAll('.description'))
                    .filter(this.isLongPost);
    },
    markLongPosts() {
        this.getLongPosts()
            .forEach(this.markLongPost.bind(this));
    },
    markLongPost(el) {
        if (this.isLongPost(el))
            el.parentNode.parentNode.classList.add('long');

        this.addLongPostListener(el);
    },
    postListener(evt) {
        const el = evt.path.find(el => el.classList.contains('description'));

        if (!el || el === document)
            return;

        const func =
                  Array.from(el.classList)
                       .includes('extended')
                  ? el.classList.remove.bind(el.classList)
                  : el.classList.add.bind(el.classList);

        func('extended');
    },
    addLongPostListener(el) {
        el.removeEventListener('click', this.postListener);
        el.removeEventListener('tap', this.postListener);

        el.addEventListener('click', this.postListener);
        el.addEventListener('tap', this.postListener);
    },
    fixQuoteLinks() {
        Array.from(document.querySelectorAll('.description .quotelink'))
             .forEach(el => {
                 // el.setAttribute('href', `https://boards.4chan.org${el.getAttribute('href')}`);
                 el.setAttribute('target', '_blank');
             });
    },
    addExpandListeners() {
        Array.from(document.querySelectorAll('.post-image-container'))
             .forEach(el => {
                 const vid = (el) => {
                     const classList = el.classList;
                     const isVid = classList.contains('large');
                     const img = el.getElementsByTagName('img')[ 0 ];

                     const func =
                               isVid
                               ? classList.remove.bind(classList)
                               : classList.add.bind(classList);

                     func('large');

                     if (!isVid) {
                         const vid = document.createElement('video');
                         const src = document.createElement('source');

                         vid.autoplay = true;
                         vid.volume = 0.5;
                         vid.controls = true;

                         src.src = img.dataset.srcFull;

                         vid.appendChild(src);

                         img.style.display = 'none';
                         el.appendChild(vid);
                     } else {
                         img.style.display = '';
                         el.removeChild(el.getElementsByTagName('video')[ 0 ]);
                     }
                 };

                 const img = (el) => {
                     const src = [ el.dataset.srcFull, el.dataset.srcThumb ];
                     const index = (src.indexOf(el.src) + 1) % 2;

                     const classList = el.parentNode.classList;

                     const func =
                               index
                               ? classList.remove.bind(classList)
                               : classList.add.bind(classList);

                     func('large');

                     el.src = src[ index ];
                 };

                 el.addEventListener('click', () => {
                     const isVideo = !!+el.dataset.isVideo;

                     if (isVideo)
                         vid(el);
                     else
                         img(el.getElementsByTagName('img')[ 0 ]);
                 });
             });
    },
    addImageLoadListener() {
        document.querySelectorAll('img')
                .forEach(el => el.addEventListener('load', (evt) => this.markLongPost(evt.path.find(el => el.classList.contains('board')).querySelector('.description'))));
    },
    removeWbrTags() {
        const wbrs = document.getElementsByTagName('wbr');

        while (wbrs.length) {
            wbrs[ 0 ].parentNode.removeChild(wbrs[ 0 ]);
        }
    },
    linkifyDescriptions() {
        document.querySelectorAll('.description')
                .forEach(el => el.innerHTML = linkifyHtml(el.innerHTML));
    },
    init() {
        // this.markLongPosts();
        this.fixQuoteLinks();
        this.addExpandListeners();
        this.addImageLoadListener();
        document.addEventListener('DOMContentLoaded', () => {
            this.removeWbrTags();
            this.linkifyDescriptions();
        });
    },
};
