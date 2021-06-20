export default class FileInfo {
  static chanBase = 'https://bunkerchan.xyz';

  static localBase = `${ process.env.THREADPULLER_DOMAIN_API }/v2/bunker-chan/files`;

  static parseFiles(files = []) {
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map(this.parseFile.bind(this));
  }

  static parseFile(file) {
    if (!file) {
      return null;
    }

    const data = {
      name: file.originalName,
      filename: file.originalName,

      dimensions: {
        main: {
          width: file.width,
          height: file.height,
        },
      },

      mime: file.mime,

      size: file.size,
    };

    return {
      ...data,
      ...this.addMeta(file.thumb, file.path),
    };
  }

  static addMeta(thumbUrl, fullUrl) {
    const meta = {
      isVideo: this.isThumbVideo(thumbUrl),
      isImage: this.isThumbImage(thumbUrl),
    };

    const src = {
      local: {
        full: `${ this.localBase }${ fullUrl }`,
        thumb: `${ this.localBase }${ thumbUrl }`,
      },

      remote: {
        full: `${ this.chanBase }${ fullUrl }`,
        thumb: `${ this.chanBase }${ thumbUrl }`,
      },
    };

    return {
      meta,
      src,
    };
  }

  static parseThumb(thumbUrl) {
    if (!thumbUrl) {
      return null;
    }

    return this.addMetaFromThumb(thumbUrl);
  }

  static addMetaFromThumb(thumbUrl) {
    const fullUrl = this.getFullUrlFromThumbUrl(thumbUrl);

    return this.addMeta(thumbUrl, fullUrl);
  }

  static isThumbVideo(thumbUrl) {
    return thumbUrl.includes('-video');
  }

  static isThumbImage(thumbUrl) {
    return thumbUrl.includes('-image');
  }

  static getFullUrlFromThumbUrl(thumbUrl) {
    // Transform the path to remove
    // the t_ from beginning of the filename
    // /.media/t_0e397c190110e3f99ab652e17ad8c0e3-imagejpeg
    //         ^^
    // into
    // /.media/0e397c190110e3f99ab652e17ad8c0e3-imagejpeg
    const fullBase = `/.media/${ thumbUrl.substr(10) }`;
    const extension = this.getExtensionFromThumbUrl(thumbUrl);

    return `${ fullBase }.${ extension }`;
  }

  static getExtensionFromThumbUrl(thumbUrl) {
    switch (true) {
      case thumbUrl.endsWith('-imagejpeg'):
        return 'jpg';

      case thumbUrl.endsWith('-imagegif'):
        return 'gif';

      case thumbUrl.endsWith('-imagesvg+xml'):
        return 'svg';

      case thumbUrl.endsWith('-imagebmp'):
        return 'bmp';

      case thumbUrl.endsWith('-audiompeg'):
        return 'mp3';

      case thumbUrl.endsWith('-audioogg'):
        return 'ogg';

      case thumbUrl.endsWith('-audiowebm'):
        return 'webm';

      case thumbUrl.endsWith('-videowebm'):
        return 'webm';

      case thumbUrl.endsWith('-videomp4'):
        return 'mp4';

      case thumbUrl.endsWith('-videoogg'):
        return 'ogg';

      case thumbUrl.endsWith('-imagepng'):
      default:
        return 'png';
    }
  }
}
