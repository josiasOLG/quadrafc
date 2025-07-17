import * as crypto from 'crypto';

export class CodeGeneratorUtil {
  static generateUniqueCode(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const hash = crypto
      .createHash('md5')
      .update(timestamp + randomBytes)
      .digest('hex');

    return `QUADRA_${hash.substring(0, 12).toUpperCase()}`;
  }
}
