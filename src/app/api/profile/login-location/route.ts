import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, updateCurrentLoginLocation } from '@/lib/auth.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function displayLocation(displayName: unknown, address: Record<string, unknown>) {
  const completeAddress = String(displayName ?? '').trim().slice(0, 500);
  if (completeAddress) return completeAddress;

  const values = [
    address.neighbourhood,
    address.suburb,
    address.village,
    address.town,
    address.city,
    address.municipality,
    address.city_district,
    address.county,
    address.region,
    address.state_district,
    address.state,
    address.country,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
  return [...new Set(values)].join(', ');
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.session) return NextResponse.json({ error: 'Sesi login tidak valid atau telah berakhir.' }, { status: 401 });

    const { latitude, longitude, accuracy } = await request.json();
    const lat = Number(latitude);
    const lon = Number(longitude);
    const precision = Number(accuracy);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180
      || !Number.isFinite(precision) || precision < 0 || precision > 5_000) {
      return NextResponse.json({ error: 'Koordinat atau akurasi lokasi tidak valid.' }, { status: 400 });
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
      headers: { Accept: 'application/json', 'Accept-Language': 'id', 'User-Agent': 'NAVIGA Login Location/1.0' },
      cache: 'no-store',
    });
    const geocode = await response.json().catch(() => null);
    const location = displayLocation(geocode?.display_name, geocode?.address ?? {});
    if (!response.ok || !location) return NextResponse.json({ error: 'Nama wilayah dari koordinat perangkat belum dapat diperoleh.' }, { status: 502 });

    const updated = await updateCurrentLoginLocation(session.user.id, session.session.id, {
      latitude: lat,
      longitude: lon,
      accuracy: precision,
      location,
    });
    if (!updated) return NextResponse.json({ error: 'Lokasi perangkat tidak dapat disimpan.' }, { status: 400 });
    return NextResponse.json({ updated: true, location, accuracy: precision }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Lokasi perangkat belum dapat disimpan.' }, { status: 500 });
  }
}
