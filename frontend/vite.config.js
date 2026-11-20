import { defineConfig } from 'vite'

export default defineConfig({
  envDir: false,
  server: {host: '127.0.0.1', port: 5174, proxy: {'/api': 'http://127.0.0.1:8113'}},
  build: {rollupOptions:{input:['index.html','travesia/index.html','travesia/breve/index.html']}},
  plugins: [{
    name:'travesia-social',
    transformIndexHtml(html,context) {
      const site=process.env.LIA_PUBLIC_ORIGIN
      if(!site||!context.path.startsWith('/travesia/')) return html
      const origin=new URL(site).origin
      const canonical=new URL(context.path.replace(/index\.html$/,''),origin).href
      return html.replace('content="/travesia/portada.jpg"', 'content="'+origin+'/travesia/portada.jpg"')
        .replace('</head>','<meta property="og:url" content="'+canonical+'"></head>')
    }
  }]
})
