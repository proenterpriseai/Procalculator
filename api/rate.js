export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    // 1차: 네이버 금융 API (매매기준율) — Streamlit 원본과 동일 URL
    try {
        const naverRes = await fetch(
            'https://m.stock.naver.com/front-api/marketIndex/productDetail?category=exchange&reutersCode=FX_USDKRW',
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://m.stock.naver.com/'
                }
            }
        );
        if (naverRes.ok) {
            const data = await naverRes.json();
            const closePrice = data?.result?.closePrice;
            if (closePrice) {
                const rate = parseFloat(String(closePrice).replace(/,/g, ''));
                if (rate > 0) {
                    return res.status(200).json({ rate, source: 'naver', timestamp: new Date().toISOString() });
                }
            }
        }
    } catch (e) { /* fallback */ }

    // 2차: 두나무(하나은행) 환율
    try {
        const hanaRes = await fetch('https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD');
        if (hanaRes.ok) {
            const data = await hanaRes.json();
            if (data && data[0] && data[0].basePrice) {
                return res.status(200).json({ rate: data[0].basePrice, source: 'dunamu', timestamp: new Date().toISOString() });
            }
        }
    } catch (e) { /* fallback */ }

    // 3차: exchangerate-api
    // v=20260907f: 1·2차와 달리 ok/값 가드가 없어 rates.KRW 부재 시 rate:undefined가 JSON에서 삭제되고
    // HTTP 200으로 나갔음(클라이언트가 실패를 인지 못하는 원인). 1·2차와 동일한 가드로 통일.
    try {
        const extRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (extRes.ok) {
            const extData = await extRes.json();
            const extRate = extData && extData.rates ? parseFloat(extData.rates.KRW) : NaN;
            if (extRate > 0) {
                return res.status(200).json({ rate: extRate, source: 'exchangerate-api', timestamp: new Date().toISOString() });
            }
        }
    } catch (e) { /* fallthrough */ }
    return res.status(500).json({ error: '환율 수신 실패' });
}
