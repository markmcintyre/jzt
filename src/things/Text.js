import { Colors } from '../graphics.js';
import { DefaultLanguage, getLanguage } from '../i18n.js';

import { Thing } from './Thing.js';


class Text extends Thing {
  constructor(board) {
    super(board);
    this.i18n = {
      en: 0,
    };
    this.foreground = Colors.BrightWhite;
    this.background = Colors.Blue;
  }
  /**
   * Serializes this Text into a data object.
   *
   * @return A data object representing a serialized Text.
   */
  serialize() {
    var result = super.serialize();
    result.i18n = this.i18n;
    return result;
  }

  /**
   * Deserializes a provided data object to configure this Text instance.
   *
   * @param A data object representing a serialized Text.
   */
  deserialize(data) {
    super.deserialize(data);
    this.i18n = data.i18n || {
      en: 0,
    };
    this.foreground = Colors.BrightWhite;
  }

  getSpriteIndex() {
    var result;

    if (this.i18n.hasOwnProperty(getLanguage())) {
      result = this.i18n[getLanguage()];
    } else {
      result = this.i18n[DefaultLanguage];
    }

    return result || 0;
  }


}


export { Text };
