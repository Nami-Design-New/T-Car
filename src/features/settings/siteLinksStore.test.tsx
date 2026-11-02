import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteLinksSync } from "./components/SiteLinksSync";
import { useSiteLinks, useSiteLinksStore } from "./siteLinksStore";

const links = {
  aboutUrl: "https://t-car.app/user/about-us?locale=en",
  termsUrl: "https://t-car.app/user/terms?locale=en",
  privacyUrl: "https://t-car.app/user/privacy?locale=en",
};

afterEach(() => useSiteLinksStore.setState({ links: {} }));

describe("site links store", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useSiteLinks());
    expect(result.current).toEqual({});
  });

  it("is filled by SiteLinksSync and read by useSiteLinks", () => {
    const { result } = renderHook(() => useSiteLinks());
    act(() => {
      render(<SiteLinksSync links={links} />);
    });
    expect(result.current).toEqual(links);
  });

  it("follows new links (e.g. another language) and renders nothing", () => {
    const { container, rerender } = render(<SiteLinksSync links={links} />);
    expect(container).toBeEmptyDOMElement();

    const arabic = {
      ...links,
      termsUrl: "https://t-car.app/user/terms?locale=ar",
    };
    rerender(<SiteLinksSync links={arabic} />);
    expect(useSiteLinksStore.getState().links.termsUrl).toBe(
      "https://t-car.app/user/terms?locale=ar",
    );
  });
});
