export class WorldEvaluationCache {
  constructor(limit=2000){this.limit=limit;this.values=new Map()}
  key(context,adapter){return [context.datetimeUtc,context.themeId,context.mode,context.spatialCellId,context.gridSystemId,context.gridVersion,context.resolution,adapter.systemId,adapter.version].join('|')}
  evaluate(context,adapter){const key=this.key(context,adapter);if(this.values.has(key))return this.values.get(key);const value=adapter.evaluate(context);this.values.set(key,value);if(this.values.size>this.limit)this.values.delete(this.values.keys().next().value);return value}
  clear(){this.values.clear()}
  get size(){return this.values.size}
}
