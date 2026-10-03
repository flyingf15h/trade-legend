import { qrSvg } from '#lib/server/qr.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({ qr: await qrSvg(locals.member!.cardCode) });
