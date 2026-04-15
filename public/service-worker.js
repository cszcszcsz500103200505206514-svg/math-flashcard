// 在 layout.tsx 里引入 katex
// 需要在 <head> 里动态加载 katex 的 CSS 和 JS
// 这里是内联注入方式

export default function KaTeXLoader() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
        integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5"
        crossOrigin="anonymous"
      />
      <script
        defer
        src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
        integrity="sha384-7zkfQkYJC2aNMJnKjDt7Wd6oR2T1LfXgE/QS9EU5ZT5C4tG6t4L5x3V6J5yGdT2"
        crossOrigin="anonymous"
      />
    </>
  )
}
