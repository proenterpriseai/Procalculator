export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    try {
        // 1차: 네이버 금융 API (매매기준율)
        const naverRes = await fetch(
            'https://m.stock.naver.com/front-api/v1/marketIndex/productDetail?category=exchange&reutersCode=FX_USDKRW',
            { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://m.stock.naver.com/' } }
        );
        if (naverRes.ok) {
            const data = await naverRes.json();
            const rate = data?.result?.calcPrice || data?.result?.closePrice;
            if (rate) {
                return res.status(200).json({ rate: parseFloat(rate), source: 'naver', timestamp: new Date().toISOString() });
            }
        }
    } catch (e) { /* fallback */ }

    try {
        // 2차: 하나은행 환율
        const hanaRes = await fetch('https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD');
        if (hanaRes.ok) {
            const data = await hanaRes.json();
            if (data && data[0]) {
                return res.status(200).json({ rate: data[0].basePrice, source: 'dunamu', timestamp: new Date().toISOString() });
            }
        }
    } catch (e) { /* fallback */ }

    try {
        // 3차: exchangerate-api
        const extRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const extData = await extRes.json();
        return res.status(200).json({ rate: extData.rates.KRW, source: 'exchangerate-api', timestamp: new Date().toISOString() });
    } catch (e) {
        return res.status(500).json({ error: '환율 수신 실패' });
    }
}
