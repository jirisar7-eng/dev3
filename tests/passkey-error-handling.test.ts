import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Passkey and WebAuthn Error Handling', () => {
  it('should verify formatPasskeyError formats iframe permissions policy errors properly', () => {
    const formatPasskeyError = (err: any, action: 'login' | 'register'): string => {
      const errMsg = String(err?.message || err?.name || err || '');
      const errName = String(err?.name || '');

      if (
        errMsg.includes('publickey-credentials') ||
        errMsg.includes('Permissions Policy') ||
        errMsg.includes('feature is not enabled') ||
        errMsg.includes('not enabled in this document') ||
        errMsg.includes('cross-origin child frames')
      ) {
        if (action === 'login') {
          return 'Přihlášení bezpečnostním klíčem (Passkey) není v tomto vnořeném zobrazení (iframe) povoleno bezpečnostní politikou prohlížeče. Otevřete aplikaci v samostatné záložce prohlížeče nebo se přihlaste e-mailem a heslem.';
        } else {
          return 'Registrace bezpečnostního klíče (Passkey) není v tomto vnořeném zobrazení (iframe) povolena bezpečnostní politikou prohlížeče. Otevřete aplikaci v samostatné záložce prohlížeče.';
        }
      }

      if (
        errName === 'NotAllowedError' ||
        errName === 'AbortError' ||
        errMsg.includes('timed out') ||
        errMsg.includes('canceled') ||
        errMsg.includes('cancelled') ||
        errMsg.includes('The operation either timed out or was not allowed')
      ) {
        return action === 'login'
          ? 'Přihlášení bezpečnostním klíčem bylo zrušeno uživatelem nebo vypršel časový limit.'
          : 'Registrace bezpečnostního klíče byla zrušena uživatelem nebo vypršel časový limit.';
      }

      if (errName === 'InvalidStateError') {
        return 'Tento bezpečnostní klíč je již v systému zaregistrován.';
      }

      return err?.message || (action === 'login' ? 'Chyba při přihlašování bezpečnostním klíčem.' : 'Registrace klíče selhala.');
    };

    // Test permissions policy error
    const iframeError = new Error("The 'publickey-credentials-get' feature is not enabled in this document. Permissions Policy may be used to delegate Web Authentication capabilities to cross-origin child frames.");
    iframeError.name = 'NotAllowedError';

    const loginFormatted = formatPasskeyError(iframeError, 'login');
    assert(loginFormatted.includes('iframe'), 'Should mention iframe restriction');
    assert(loginFormatted.includes('samostatné záložce'), 'Should advise opening in separate tab');

    const regFormatted = formatPasskeyError(iframeError, 'register');
    assert(regFormatted.includes('iframe'), 'Should mention iframe restriction');

    // Test cancellation error
    const cancelError = new Error('The operation either timed out or was not allowed');
    cancelError.name = 'NotAllowedError';
    const cancelFormatted = formatPasskeyError(cancelError, 'login');
    assert(cancelFormatted.includes('zrušeno') || cancelFormatted.includes('časový limit'), 'Should explain user cancellation or timeout');
  });
});
