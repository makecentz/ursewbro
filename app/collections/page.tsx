import CollectionsPage from "../../components/CollectionsPage";
import { getStoreProducts } from "../../lib/printify";

export const dynamic = "force-dynamic";

export default async function Collections() {
  return <CollectionsPage initialProducts={await getStoreProducts()} />;
}
