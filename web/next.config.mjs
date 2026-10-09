/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // 静态导出不支持 next/image 优化器，统一用原生 <img>（antd Image 也是）
  images: { unoptimized: true },
}

if (isDev) {
  // 开发期：Next 开发服务器不做静态导出，用 rewrites 把同源 /api、/uploads 转发到
  // SpringBoot 8080，既避免跨域，也不用在代码里硬编码后端地址。
  // 注意：rewrites 与 output:'export' 不能共存，故开发期不设置 output。
  nextConfig.rewrites = async () => [
    { source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' },
    { source: '/uploads/:path*', destination: 'http://localhost:8080/uploads/:path*' },
  ]
} else {
  // 生产构建：next build 生成纯静态产物到 out/，交由 Nginx 托管；
  // 接口反代由 Nginx 负责，因此不需要 rewrites。
  nextConfig.output = 'export'
}

export default nextConfig
