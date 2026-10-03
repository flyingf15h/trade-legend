import QRCode from 'qrcode';

export function qrSvg(text: string) {
	return QRCode.toString(text, {
		type: 'svg',
		margin: 1,
		errorCorrectionLevel: 'M',
		color: { dark: '#3b211cff', light: '#00000000' }
	});
}
