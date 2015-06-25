import {isStateProperty}    from "./Util";
import Model                from "./Model";

class Collection extends Model {

    //------------------------------------------------------------------------
    //
    //                              Private
    //
    //------------------------------------------------------------------------

    formatToPrimitive(str) {
        var value = JSON.parse(str);
        return Array.isArray(value)? value : [value];
    }

    // {[string]},{[[number]|number]} => {[object]}
    bundleProperties(propertyNames, propertyValues) {
        let formatValues = propertyValues.map(this.formatToPrimitive);
        let minLength = formatValues.reduce((m,x)=>Math.min(m,x.length), Number.MAX_VALUE);
        let documents = Array.from({length:minLength}).map(_=>({}));
        return formatValues.reduce((documents, ls, i)=>{
            let propName = propertyNames[i];
            ls.slice(0, minLength).forEach((x,i)=>documents[i][propName] = x);
            return documents;
        },documents);
    }
}

export default Collection;