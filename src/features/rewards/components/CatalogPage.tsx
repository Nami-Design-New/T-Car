import type { RewardCatalogData } from "../model";
import CatalogRedemption from "./CatalogRedemption";

interface Props {
  data: RewardCatalogData;
}

export default function CatalogPage({ data }: Props) {
  return <CatalogRedemption data={data} />;
}
