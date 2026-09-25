const { Stage, aws_codepipeline_actions} = require('aws-cdk-lib');
const {SharedNotificationMigrationStack} = require("./shared-notification-migration-stack");

class MigrationStage extends Stage {
    constructor(scope, id, props) {
        super(scope, id, props);
        new SharedNotificationMigrationStack(this, 'SharedNotificationMigrationStack', props);
    }
}

module.exports = { MigrationStage };
