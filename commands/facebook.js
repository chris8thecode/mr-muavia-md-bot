const axios = require('axios');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

async function facebookCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a Facebook video URL.\nExample: .fb https://www.facebook.com/..."
            }, { quoted: message });
        }

        // Validate Facebook URL
        if (!url.includes('facebook.com')) {
            return await sock.sendMessage(chatId, { 
                text: "That is not a Facebook link."
            }, { quoted: message });
        }

        // Send loading reaction
        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        // Resolve share/short URLs to their final destination first
        let resolvedUrl = url;
        try {
            const res = await axios.get(url, { timeout: 20000, maxRedirects: 10, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const possible = res?.request?.res?.responseUrl;
            if (possible && typeof possible === 'string') {
                resolvedUrl = possible;
            }
        } catch {
            // ignore resolution errors; use original url
        }

        // Primary: Siputzx API
        async function fetchFromSiputzx(u) {
            const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(u)}`;
            const response = await axios.get(apiUrl, {
                timeout: 20000,
                headers: {
                    'accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxRedirects: 5,
                validateStatus: s => s >= 200 && s < 500
            });

            const data = response.data;
            if (data && data.status && data.data && Array.isArray(data.data.data)) {
                const hdVideo = data.data.data.find(item => item.resolution === 'HD' && item.format === 'mp4');
                const sdVideo = data.data.data.find(item => item.resolution === 'SD' && item.format === 'mp4');
                const fbvid = hdVideo?.url || sdVideo?.url;
                if (fbvid) return { fbvid, title: data.data.title || 'Facebook Video' };
            }
            throw new Error('Siputzx API returned no downloadable video');
        }

        // Fallback: NexOracle API
        async function fetchFromNexoracle(u) {
            const apiUrl = `https://api.nexoracle.com/downloader/facebook?apikey=free_key@maher_apis&url=${encodeURIComponent(u)}`;
            const response = await axios.get(apiUrl, { timeout: 20000, validateStatus: s => s >= 200 && s < 500 });
            const data = response.data;
            const result = data?.result;
            const fbvid = result?.hd || result?.sd || result?.url;
            if (data && (data.status === 200 || data.status === true) && fbvid) {
                return { fbvid, title: result?.title || 'Facebook Video' };
            }
            throw new Error('NexOracle API returned no downloadable video');
        }

        // Try each source against the resolved URL, then the original URL, in order
        const sources = [
            { name: 'Siputzx', run: fetchFromSiputzx },
            { name: 'NexOracle', run: fetchFromNexoracle }
        ];

        let result = null;
        let lastError;
        for (const source of sources) {
            for (const candidateUrl of [resolvedUrl, url]) {
                try {
                    result = await source.run(candidateUrl);
                    break;
                } catch (err) {
                    lastError = err;
                    console.error(`Facebook source "${source.name}" failed for one URL variant: ${err.message}`);
                }
            }
            if (result) break;
        }

        const fbvid = result?.fbvid;
        const title = result?.title;

        if (!fbvid) {
            return await sock.sendMessage(chatId, { 
                text: '❌ Failed to get video URL from Facebook.\n\nPossible reasons:\n• Video is private or deleted\n• Link is invalid\n• Video is not available for download\n\nPlease try a different Facebook video link.'
            }, { quoted: message });
        }

        // Try URL method first (more reliable)
        try {
            const caption = title ? `> *DOWNLOAD BY ${settings.botName.toUpperCase()}*\n\n📝 Title: ${title}` : `> *DOWNLOAD BY ${settings.botName.toUpperCase()}*`;
            
            await sock.sendMessage(chatId, {
                video: { url: fbvid },
                mimetype: "video/mp4",
                caption: caption
            }, { quoted: message });
            
            return;
        } catch (urlError) {
            console.error(`URL method failed: ${urlError.message}`);
            
            // Fallback to buffer method
            try {
                // Create temp directory if it doesn't exist
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                // Generate temp file path
                const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

                try {
                    const MAX_FB_VIDEO_BYTES = 90 * 1024 * 1024; // 90MB safety cap

                    // Download the video
                    const videoResponse = await axios({
                        method: 'GET',
                        url: fbvid,
                        responseType: 'stream',
                        timeout: 60000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Referer': 'https://www.facebook.com/'
                        }
                    });

                    const declaredLength = parseInt(videoResponse.headers['content-length'] || '0', 10);
                    if (declaredLength && declaredLength > MAX_FB_VIDEO_BYTES) {
                        videoResponse.data.destroy();
                        throw new Error(`Video is ${(declaredLength / (1024 * 1024)).toFixed(1)}MB, over the size limit`);
                    }

                    const writer = fs.createWriteStream(tempFile);
                    let downloaded = 0;
                    let aborted = false;
                    videoResponse.data.on('data', chunk => {
                        downloaded += chunk.length;
                        if (!aborted && downloaded > MAX_FB_VIDEO_BYTES) {
                            aborted = true;
                            videoResponse.data.destroy();
                            writer.destroy();
                        }
                    });
                    videoResponse.data.pipe(writer);

                    await new Promise((resolve, reject) => {
                        writer.on('finish', () => aborted ? reject(new Error('Video exceeds size limit')) : resolve());
                        writer.on('error', reject);
                        videoResponse.data.on('error', reject);
                    });

                    // Check if file was downloaded successfully
                    if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
                        throw new Error('Failed to download video');
                    }

                    // Send the video
                    const caption = title ? `> DOWNLOAD BY ${settings.botName.toUpperCase()}\n\n📝 Title: ${title}` : `> DOWNLOAD BY ${settings.botName.toUpperCase()}`;

                    await sock.sendMessage(chatId, {
                        video: { url: tempFile },
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: message });
                } finally {
                    // Always attempt cleanup, whether the send succeeded or an error was thrown above,
                    // so failed downloads/sends never leave orphaned files behind.
                    try {
                        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                    } catch (err) {
                        console.error('Error cleaning up temp file:', err);
                    }
                }
                return;
            } catch (bufferError) {
                console.error(`Buffer method also failed: ${bufferError.message}`);
                throw new Error('Both URL and buffer methods failed');
            }
        }

    } catch (error) {
        console.error('Error in Facebook command:', error);
        await sock.sendMessage(chatId, { 
            text: "❌ Couldn't download that Facebook video. The link may be private, invalid, or the download service is temporarily unavailable."
        }, { quoted: message });
    }
}

module.exports = facebookCommand; 