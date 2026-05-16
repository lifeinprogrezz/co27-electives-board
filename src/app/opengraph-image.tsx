import { ImageResponse } from 'next/og'

export const alt = 'co27.electives — trade Co27 electives with your cohort'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadFont(family: string, weight: string) {
  const res = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
  )
  const css = await res.text()
  const url = css.match(/src: url\((https:\/\/[^)]+)\) format/)?.[1]
  if (!url) throw new Error(`Could not extract font URL for ${family}`)
  const font = await fetch(url)
  return font.arrayBuffer()
}

export default async function Image() {
  const [serif, sans] = await Promise.all([
    loadFont('Instrument+Serif', '400'),
    loadFont('Geist', '500'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#002D73',
          position: 'relative',
          padding: '80px',
          fontFamily: 'Geist',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -180,
            width: 560,
            height: 560,
            borderRadius: '50%',
            backgroundColor: '#73BEEF',
            opacity: 0.22,
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -160,
            width: 460,
            height: 460,
            borderRadius: '50%',
            backgroundColor: '#EFBE73',
            opacity: 0.18,
            filter: 'blur(80px)',
          }}
        />

        <div
          style={{
            display: 'flex',
            color: '#73BEEF',
            fontSize: 28,
            fontFamily: 'Instrument Serif',
            letterSpacing: '-0.01em',
            opacity: 0.9,
          }}
        >
          co27.electives
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              color: '#FFFFFF',
              fontSize: 128,
              lineHeight: 1,
              fontFamily: 'Instrument Serif',
              letterSpacing: '-0.03em',
            }}
          >
            <span>trade your&nbsp;</span>
            <span style={{ color: '#EFBE73' }}>electives</span>
            <span>.</span>
          </div>
          <div
            style={{
              display: 'flex',
              color: '#FFFFFF',
              opacity: 0.75,
              fontSize: 32,
              fontFamily: 'Geist',
              letterSpacing: '-0.01em',
            }}
          >
            Post what you&rsquo;re dropping. See who wants it. ESADE Co27.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: serif, weight: 400, style: 'normal' },
        { name: 'Geist', data: sans, weight: 500, style: 'normal' },
      ],
    },
  )
}
