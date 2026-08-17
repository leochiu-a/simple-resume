/**
 * A block of schema.org JSON-LD.
 *
 * Next's `metadata` export covers the tags a social scraper reads; it has no slot for
 * structured data, and the documented way to add it is a `<script>` in the page body —
 * so this renders one. It is a server component and the graph is built at module scope,
 * which keeps the payload out of the client bundle entirely.
 *
 * `JSON.stringify` is the escape here: the value is data this repo wrote, never user
 * input, and the one sequence that could close the tag early (`</script>` inside a
 * string) is replaced below rather than assumed absent.
 */
const JsonLd = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    }}
  />
);

export default JsonLd;
