// scripts/extract-transcript.js
// A simple Node.js script to help extract YouTube transcripts for your curated library
// Run: node scripts/extract-transcript.js <YouTube-URL>

const fs = require('fs').promises;
const path = require('path');

// Extract video ID from URL
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Parse time string to seconds
function parseTime(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Manual transcript extraction helper
async function extractTranscriptManually() {
  console.log('\n=== Manual Transcript Extraction ===');
  console.log('1. Open the YouTube video in your browser');
  console.log('2. Click the "..." menu below the video');
  console.log('3. Select "Show transcript"');
  console.log('4. Copy the Korean transcript');
  console.log('5. Paste it into a file called "transcript.txt" in this directory');
  console.log('6. Format: Each line should be "timestamp text"');
  console.log('   Example: 0:00 안녕하세요');
  console.log('\nPress Enter when ready...');
  
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  try {
    const transcriptPath = path.join(process.cwd(), 'transcript.txt');
    const content = await fs.readFile(transcriptPath, 'utf8');
    
    const lines = content.trim().split('\n');
    const segments = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse "0:00 text" format
      const match = line.match(/^(\d+:\d+(?::\d+)?)\s+(.+)$/);
      if (match) {
        const start = parseTime(match[1]);
        const text = match[2];
        
        // Estimate end time from next segment or add 2-3 seconds
        let end = start + 2;
        if (i < lines.length - 1) {
          const nextMatch = lines[i + 1].match(/^(\d+:\d+(?::\d+)?)/);
          if (nextMatch) {
            end = parseTime(nextMatch[1]) - 0.1;
          }
        }
        
        segments.push({ text, start, end });
      }
    }
    
    return segments;
  } catch (error) {
    console.error('Error reading transcript.txt:', error.message);
    return null;
  }
}

// Format segments for the curated library
function formatSegmentsForCode(videoId, videoTitle, segments) {
  const code = `
  '${videoId}': {
    id: '${videoId}',
    title: '${videoTitle}',
    channel: 'Channel Name Here',
    level: 'Beginner',
    segments: [
${segments.map(seg => `      { text: '${seg.text}', start: ${seg.start}, end: ${seg.end} },`).join('\n')}
    ]
  },`;
  
  return code;
}

// Main function
async function main() {
  const url = process.argv[2];
  
  if (!url) {
    console.log('Usage: node extract-transcript.js <YouTube-URL>');
    return;
  }
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error('Invalid YouTube URL');
    return;
  }
  
  console.log(`Video ID: ${videoId}`);
  console.log(`URL: https://www.youtube.com/watch?v=${videoId}`);
  
  // Since we can't directly access YouTube transcripts from Node.js due to CORS,
  // we'll guide the user through manual extraction
  const segments = await extractTranscriptManually();
  
  if (segments && segments.length > 0) {
    console.log(`\nExtracted ${segments.length} segments!`);
    
    // Get video title from user
    console.log('\nEnter video title:');
    const videoTitle = await new Promise(resolve => {
      process.stdin.once('data', data => resolve(data.toString().trim()));
    });
    
    // Generate code for curatedVideos.ts
    const code = formatSegmentsForCode(videoId, videoTitle, segments);
    
    // Save to file
    const outputPath = path.join(process.cwd(), `transcript-${videoId}.js`);
    await fs.writeFile(outputPath, code);
    
    console.log(`\nTranscript saved to: ${outputPath}`);
    console.log('\nAdd this to your curatedVideos.ts file:');
    console.log(code);
    
    // Also save as JSON for backup
    const jsonPath = path.join(process.cwd(), `transcript-${videoId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify({ videoId, videoTitle, segments }, null, 2));
    console.log(`\nJSON backup saved to: ${jsonPath}`);
  }
}

main().catch(console.error);
