const { Stage } = require('aws-cdk-lib');
const { SharedInfraStack } = require('./shared-infra-stack');

class ProductionStage extends Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    new SharedInfraStack(scope, id, props);
  }
}

module.exports = { ProductionStage };
