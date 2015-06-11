/**
 * Created by ychen on 6/11/15.
 */
import Model from "./Model";
import CollectionMixin from "./CollectionMixin";
import {mixin} from "lodash"

class Collection extends Model{
}

mixin(Collection.prototype, CollectionMixin);

export default Collection;