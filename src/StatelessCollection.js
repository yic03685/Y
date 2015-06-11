/**
 * Created by ychen on 6/11/15.
 */
import StatelessModel from "./StatelessModel";
import CollectionMixin from "./CollectionMixin";
import {mixin} from "lodash"

class StatelessCollection extends StatelessModel{
}

mixin(StatelessCollection.prototype, CollectionMixin);

export default StatelessCollection;