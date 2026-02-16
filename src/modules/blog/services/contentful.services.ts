class ContentfulServices {
  private compositeBaseUrl: string;
  private headers: HeadersInit;

  constructor() {
    const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
    const CONTENTFUL_API_BASE_URL = process.env.CONTENTFUL_API_BASE_URL;
    const CONTENTFUL_API_ACCESS_TOKEN = process.env.CONTENTFUL_API_ACCESS_TOKEN;

    if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_API_BASE_URL || !CONTENTFUL_API_ACCESS_TOKEN) {
      throw new Error("Missing Contentful environment variables");
    }

    this.compositeBaseUrl = `${CONTENTFUL_API_BASE_URL}/spaces/${CONTENTFUL_SPACE_ID}/environments/master`;
    this.headers = {
      Authorization: `Bearer ${CONTENTFUL_API_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  private async fetchEntries(params: Record<string, string>) {
    const url = new URL(`${this.compositeBaseUrl}/entries`);
    Object.entries({
      include: "2",
      ...params
    }).forEach(([key, value]) => url.searchParams.append(key, value));

    const response = await fetch(url.toString(), {
      headers: this.headers,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(
        `Contentful API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  private resolveAuthors(entry: any) {
    const entries = entry.includes?.Entry || [];

    if (!entry.fields?.authors) return [];

    return entry.fields.authors.map((authorLink: any) => {
      if (authorLink.sys?.type === "Link" && authorLink.sys.linkType === "Entry") {
        const authorEntry = entries.find((entry: any) => entry.sys.id === authorLink.sys.id);
        return authorEntry?.fields ?? null;
      }
      return null;
    });
  }

  async getManifesto() {
    const data = await this.fetchEntries({
      content_type: "manifesto",
      limit: "1",
    });

    const manifesto = data.items?.[0] ?? null;
    if (manifesto) {
      manifesto.fields.authors = this.resolveAuthors({ ...data, fields: manifesto.fields });
    }
    return manifesto;
  }


  async getLatestBlogPosts(numberOfPosts: number = 3) {
    const data = await this.fetchEntries({
      content_type: "blogPost",
      order: "-sys.createdAt",
      limit: numberOfPosts.toString(),
    });

    return data.items ?? null;
  }

  async getPostById(id: string) {
    const url = `${this.compositeBaseUrl}/entries/${id}`;

    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Contentful API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getAllBlogPosts() {
    const data = await this.fetchEntries({
      content_type: "blogPost",
      order: "-sys.createdAt"
    });

    return data.items ?? null;
  }
}

const contentfulServices = new ContentfulServices();
export default contentfulServices;

