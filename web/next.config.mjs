/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出：next build 直接生成纯静态产物到 out/，交由 Nginx 托管
  output: 'export',
  // 静态导出不支持 next/image 优化器，统一用原生 <img>（antd Image 也是）
  images: { unoptimized: true },
}

// rewrites 仅在开发期生效（output:'export' 不支持自定义路由，生产环境由 Nginx 反代）。
// 开发时浏览器只访问同源的 3000 端口，由 Next 把 /api、/uploads 转发到 SpringBoot 8080，
// 既避免跨域，也不用在代码里硬编码后端地址。
if (process.env.NODE_ENV === 'development') {
  nextConfig.rewrites = async () => [
    { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' },
    { source: '/uploads/:path*', destination: 'http://localhost:8080/uploads/:path*' },
  ]
}

export default nextConfig
