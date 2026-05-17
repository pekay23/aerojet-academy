const fs = require('fs');
const zlib = require('zlib');

const pbPath = 'C:\\Users\\PC\\.gemini\\antigravity\\conversations\\02b30efc-32c9-4e0c-a287-7ff201198bc2.pb';
if (!fs.existsSync(pbPath)) {
  console.error("PB file does not exist");
  process.exit(1);
}

const buffer = fs.readFileSync(pbPath);
console.log("Input buffer size:", buffer.length);
console.log("First few bytes:", buffer.slice(0, 20));

// Try Gunzip
zlib.gunzip(buffer, (err, decompressed) => {
  if (!err) {
    console.log("Decompressed successfully with gunzip! Size:", decompressed.length);
    fs.writeFileSync('scratch/decompressed_pb.bin', decompressed);
    return;
  }
  console.log("Gunzip failed:", err.message);

  // Try Inflate (zlib)
  zlib.inflate(buffer, (err2, decompressed2) => {
    if (!err2) {
      console.log("Decompressed successfully with inflate! Size:", decompressed2.length);
      fs.writeFileSync('scratch/decompressed_pb.bin', decompressed2);
      return;
    }
    console.log("Inflate failed:", err2.message);

    // Try Brotli
    zlib.brotliDecompress(buffer, (err3, decompressed3) => {
      if (!err3) {
        console.log("Decompressed successfully with Brotli! Size:", decompressed3.length);
        fs.writeFileSync('scratch/decompressed_pb.bin', decompressed3);
        return;
      }
      console.log("Brotli failed:", err3.message);
    });
  });
});
